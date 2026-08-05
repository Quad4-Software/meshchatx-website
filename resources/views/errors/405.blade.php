@php
    $page = 'error';
    $status = 405;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="405" />
@endsection
