@php
    $page = 'error';
    $status = 502;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="502" />
@endsection
