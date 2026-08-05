@php
    $page = 'error';
    $status = 419;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="419" />
@endsection
